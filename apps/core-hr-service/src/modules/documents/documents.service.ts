import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    employeeId?: string;
    name: string;
    type: string;
    category: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedById: string;
  }) {
    return this.prisma.document.create({
      data: { tenantId, ...data },
    });
  }

  async findAll(tenantId: string, employeeId?: string, category?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (category) where.category = category;

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(tenantId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id } });
    // TODO: Delete file from MinIO
    return { deleted: true };
  }
}
